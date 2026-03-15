export type ToolRecord = {
  id: string;
  name: string;
  url: string;
  description: string;
  category?: string;
  logoUrl?: string;
  bannerUrl?: string;
  published: boolean;
  order: number;
  clicksCount?: number;
  lastClickedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ToolPayload = {
  name: string;
  url: string;
  description: string;
  category?: string;
  logoUrl?: string;
  bannerUrl?: string;
  published: boolean;
  order: number;
};

export const emptyToolPayload: ToolPayload = {
  name: "",
  url: "",
  description: "",
  category: "",
  logoUrl: "",
  bannerUrl: "",
  published: false,
  order: 0,
};
