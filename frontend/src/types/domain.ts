export type OrderStatus =
  | "processing"
  | "completed"
  | "invalid"
  | "failed";

export interface PackerItem {
  ItemCode: string;
  ItemReference: string;
  Width: number;
  Length: number;
  Depth: number;
  Weight: number;
  Quantity: number;
  BoxGroup?: string;
}

export interface BoxType {
  Reference: string;
  Width: number;
  Length: number;
  Depth: number;
  MaxWeight?: number;
  BoxWeight?: number;
  Active?: boolean;
  MaximumBoxes?: number;
}

export interface PackerRequest {
  items: PackerItem[];
  boxes: BoxType[];
}

export interface PackedBoxResult {
  id: string;
  boxNumber: number;
  reference: string;
  width: number;
  length: number;
  depth: number;
  maxWeight?: number;
  packedWeight: number;
  utilisationPercent: number;
  items: PackerItem[];
}

export interface PackingResult {
  orderRef: string;
  status: OrderStatus;
  durationMs: number;
  completedAt: string;
  packedItems: PackerItem[];
  unpackedItems: PackerItem[];
  boxes: PackedBoxResult[];
  raw?: unknown;
}

export interface StoredOrder {
  id: string;
  orderRef: string;
  status: OrderStatus;
  itemCount: number;
  boxCount: number;
  createdAt: string;
  completedAt?: string;
  durationMs?: number;
  request: PackerRequest;
  result?: PackingResult;
}