export interface FileStorageConfig {
  provider: string;
  publicBaseUrl: string;
  localRootDir: string;
  updatedAt: string;
}

export interface FileStorageConfigWire {
  provider?: string;
  publicBaseUrl?: string;
  public_base_url?: string;
  localRootDir?: string;
  local_root_dir?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface FileStorageConfigEnvelope {
  success: boolean;
  message: string;
  item?: FileStorageConfigWire | null;
  errCode?: number;
  code?: number;
  nonce?: string;
}

export interface UpdateFileStorageConfigPayload {
  provider: string;
  publicBaseUrl?: string;
  localRootDir?: string;
}
