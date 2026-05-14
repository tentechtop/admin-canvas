import { businessRequest } from "@/lib/business-http";
import type {
  FileStorageConfig,
  FileStorageConfigEnvelope,
  FileStorageConfigType,
  FileStorageConfigWire,
  UpdateFileStorageConfigPayload,
} from "@/types/file-storage-config";

function normalizeProvider(value?: string): FileStorageConfig["provider"] {
  return value === "local" || value === "coss" ? value : "";
}

function normalizeFileStorageConfig(item?: FileStorageConfigWire | null): FileStorageConfig {
  return {
    provider: normalizeProvider(item?.provider),
    uploadUrl: String(item?.uploadUrl ?? item?.upload_url ?? ""),
    publicBaseUrl: String(item?.publicBaseUrl ?? item?.public_base_url ?? ""),
    localRootDir: String(item?.localRootDir ?? item?.local_root_dir ?? ""),
    updatedAt: String(item?.updatedAt ?? item?.updated_at ?? ""),
  };
}

export const fileStorageConfigApi = {
  getConfig: async (type: FileStorageConfigType) => {
    const result = await businessRequest<unknown>({
      url: "/admin/file_storage/config",
      method: "GET",
      params: { type },
    });
    const envelope = result.envelope as unknown as FileStorageConfigEnvelope;
    return {
      ...result,
      value: normalizeFileStorageConfig(envelope.item),
    };
  },

  updateConfig: async (payload: UpdateFileStorageConfigPayload) => {
    const result = await businessRequest<unknown>({
      url: "/admin/file_storage/config",
      method: "PUT",
      data: payload,
    });
    const envelope = result.envelope as unknown as FileStorageConfigEnvelope;
    return {
      ...result,
      value: normalizeFileStorageConfig(envelope.item),
    };
  },
};
