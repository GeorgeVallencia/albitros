import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

interface Role {
  name: string;
  permissions: Permission[];
}

// Define role-based access control (RBAC) permissions
const RBAC_ROLES: Record<string, Role> = {
  ADMIN: {
    name: 'Administrator',
    permissions: [
      // User management
      { resource: 'users', action: 'create' },
      { resource: 'users', action: 'read' },
      { resource: 'users', action: 'update' },
      { resource: 'users', action: 'delete' },

      // Company management
      { resource: 'company', action: 'read' },
      { resource: 'company', action: 'update' },

      // Fraud detection
      { resource: 'fraud', action: 'read' },
      { resource: 'fraud', action: 'investigate' },
      { resource: 'fraud', action: 'export' },

      // Audit logs
      { resource: 'audit', action: 'read' },

      // System settings
      { resource: 'system', action: 'read' },
      { resource: 'system', action: 'update' },

      // Reports
      { resource: 'reports', action: 'read' },
      { resource: 'reports', action: 'create' },
      { resource: 'reports', action: 'export' }
    ]
  },

  MEMBER: {
    name: 'Member',
    permissions: [
      // User management (limited)
      { resource: 'users', action: 'read', conditions: { ownProfileOnly: true } },
      { resource: 'users', action: 'update', conditions: { ownProfileOnly: true } },

      // Company management (read-only)
      { resource: 'company', action: 'read' },

      // Fraud detection (core functionality)
      { resource: 'fraud', action: 'read' },
      { resource: 'fraud', action: 'investigate' },

      // Reports (limited)
      { resource: 'reports', action: 'read' },
      { resource: 'reports', action: 'create', conditions: { ownReportsOnly: true } }
    ]
  },

  VIEWER: {
    name: 'Viewer',
    permissions: [
      // Read-only access
      { resource: 'users', action: 'read', conditions: { ownProfileOnly: true } },
      { resource: 'company', action: 'read' },
      { resource: 'fraud', action: 'read' },
      { resource: 'reports', action: 'read' }
    ]
  }
};

export class RBAC {
  /**
   * Check if a user has permission for a specific action on a resource
   */
  static async hasPermission(
    userId: string,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Get user with role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, companyId: true }
      });

      if (!user) {
        return false;
      }

      // Get role permissions
      const role = RBAC_ROLES[user.role];
      if (!role) {
        return false;
      }

      // Find matching permission
      const permission = role.permissions.find(
        p => p.resource === resource && p.action === action
      );

      if (!permission) {
        return false;
      }

      // Check conditions if present
      if (permission.conditions && context) {
        return this.evaluateConditions(permission.conditions, context, user);
      }

      return true;

    } catch (error) {
      console.error('RBAC permission check error:', error);
      return false;
    }
  }

  /**
   * Get all permissions for a user
   */
  static async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) {
        return [];
      }

      const role = RBAC_ROLES[user.role];
      return role ? role.permissions : [];

    } catch (error) {
      console.error('Get user permissions error:', error);
      return [];
    }
  }

  /**
   * Check permission conditions (e.g., own profile only)
   */
  private static evaluateConditions(
    conditions: Record<string, any>,
    context: Record<string, any>,
    user: any
  ): boolean {
    // Own profile only condition
    if (conditions.ownProfileOnly) {
      return context.userId === user.id;
    }

    // Own reports only condition
    if (conditions.ownReportsOnly) {
      return context.createdBy === user.id;
    }

    // Company-specific condition
    if (conditions.companyOnly) {
      return context.companyId === user.companyId;
    }

    return true;
  }

  /**
   * Middleware to check permissions for API routes
   */
  static requirePermission(resource: string, action: string) {
    return async (req: NextRequest, handler: (req: NextRequest, context: any) => Promise<NextResponse>) => {
      try {
        // Get session
        const session = await getServerSession();

        if (!session) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        // Check permission
        const hasPermission = await this.hasPermission(
          session.sub,
          resource,
          action,
          {
            userId: req.headers.get('x-user-id'),
            companyId: req.headers.get('x-company-id'),
            // Add more context as needed
          }
        );

        if (!hasPermission) {
          // Log unauthorized access attempt
          await prisma.auditLog.create({
            data: {
              userId: session.sub,
              action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
              resource,
              details: {
                attemptedAction: action,
                ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
                userAgent: req.headers.get('user-agent') || 'unknown'
              },
              ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
            }
          });

          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }

        // Add user context to request
        const context = {
          user: {
            id: session.sub,
            email: session.email,
            role: session.role
          }
        };

        return await handler(req, context);

      } catch (error) {
        console.error('RBAC middleware error:', error);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    };
  }

  /**
   * Get role hierarchy for permission escalation checks
   */
  static getRoleHierarchy(): Record<string, number> {
    return {
      'ADMIN': 3,
      'MEMBER': 2,
      'VIEWER': 1
    };
  }

  /**
   * Check if user can perform action on another user (role-based)
   */
  static async canManageUser(managerId: string, targetUserId: string): Promise<boolean> {
    try {
      const [manager, target] = await Promise.all([
        prisma.user.findUnique({ where: { id: managerId }, select: { role: true } }),
        prisma.user.findUnique({ where: { id: targetUserId }, select: { role: true } })
      ]);

      if (!manager || !target) {
        return false;
      }

      const hierarchy = this.getRoleHierarchy();
      return hierarchy[manager.role] > hierarchy[target.role];

    } catch (error) {
      console.error('Can manage user check error:', error);
      return false;
    }
  }

  /**
   * Get available roles
   */
  static getAvailableRoles(): Role[] {
    return Object.values(RBAC_ROLES);
  }

  /**
   * Get role by name
   */
  static getRole(roleName: string): Role | undefined {
    return RBAC_ROLES[roleName];
  }
}

// Helper function to create permission middleware
export function requireAuthWithPermission(resource: string, action: string) {
  return RBAC.requirePermission(resource, action);
}
