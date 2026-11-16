import { useState } from "react";
import useSWR from "swr";
import { Button } from "@makeplane/propel/components/button";
import { PageHead } from "@/components/core/page-title";
import { personalService } from "@/services/personal.service";

export default function PersonalDataPage() {
  const { data: backups, mutate, error } = useSWR("PERSONAL_BACKUPS", () => personalService.listBackups());
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const createBackup = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      await personalService.createBackup();
      await mutate();
    } catch (backupError: unknown) {
      console.error("创建个人数据备份失败", backupError);
      setCreateError("备份失败，请查看 data/logs/plane-personal.log 后重试。");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-surface-1 px-page-x py-6">
      <PageHead title="数据与备份" />
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-h5-semibold text-primary">数据与备份</h1>
            <p className="mt-2 text-body-sm-regular text-secondary">备份包含项目数据、附件、头像和文档图片。</p>
          </div>
          <Button
            variant="primary"
            size="md"
            stretch="auto"
            onClick={() => void createBackup()}
            disabled={creating}
            label={creating ? "正在备份…" : "创建备份"}
          />
        </div>
        {(error || createError) && (
          <p role="alert" className="text-red-600 text-body-sm-regular">
            {createError || "无法读取备份列表。"}
          </p>
        )}
        <div className="overflow-hidden rounded-lg border border-subtle">
          <table className="w-full text-left text-body-sm-regular">
            <thead className="bg-surface-2 text-secondary">
              <tr>
                <th className="px-4 py-3">备份文件</th>
                <th className="px-4 py-3">大小</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {backups?.map((backup) => (
                <tr key={backup.name}>
                  <td className="px-4 py-3 text-primary">{backup.name}</td>
                  <td className="px-4 py-3 text-secondary">{(backup.size / 1024 / 1024).toFixed(2)} MB</td>
                  <td className="px-4 py-3">
                    <a
                      className="text-accent-primary"
                      href={`/api/personal/backups/${encodeURIComponent(backup.name)}/`}
                    >
                      下载
                    </a>
                  </td>
                </tr>
              ))}
              {backups?.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-secondary" colSpan={3}>
                    尚无备份，点击“创建备份”保存当前数据。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
