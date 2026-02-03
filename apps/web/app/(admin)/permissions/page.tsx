import { useLocale } from "@repo/i18n";
import { toast } from "@repo/propel";
import { getPermissions, type PermissionDto } from "@repo/services";
import { Badge, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@repo/ui";
import { useEffect, useState } from "react";

/**
 * 权限列表页（只读）
 */
export default function PermissionsPage() {
  const { t } = useLocale();
  const [permissions, setPermissions] = useState<PermissionDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const result = await getPermissions();
        setPermissions(result);
      } catch (error) {
        console.error("加载权限列表失败:", error);
        toast.error(t("admin.errors.loadPermissionsFailed"));
      } finally {
        setLoading(false);
      }
    };
    loadPermissions();
  }, []);

  // 按 resource 分组
  const groupedPermissions = permissions.reduce(
    (acc, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push(perm);
      return acc;
    },
    {} as Record<string, PermissionDto[]>,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("admin.permissions.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("admin.permissions.list.total", { total: permissions.length })}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.permissions.list.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : permissions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">{t("admin.permissions.list.empty")}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([resource, perms]) => (
                <div key={resource} className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase">{resource}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {perms.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{perm.action}</Badge>
                            <span className="text-sm font-medium">{perm.resource}</span>
                          </div>
                          {perm.description && <p className="text-xs text-muted-foreground mt-1">{perm.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
