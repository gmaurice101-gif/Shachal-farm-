export type UserRole = 'manager' | 'executive' | 'worker';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export interface CropCycle {
  id: string;
  cropType: string;
  variety: string;
  plantingDate: string;
  expectedHarvestDate?: string;
  landArea: number;
  status: 'planned' | 'growing' | 'harvested' | 'failed';
  fertilizerCost: number;
  labourCost: number;
  seedCost: number;
  plantingCost: number;
  harvestCost: number;
  totalProductionCost: number;
  managerUid: string;
}

export interface LivestockEntry {
  id: string;
  date: string;
  cowId: string;
  milkVolume: number;
  feedConsumed: number;
  recordedBy: string;
}

export interface Expense {
  id: string;
  date: string;
  category: 'wages' | 'feed' | 'maintenance' | 'other';
  amount: number;
  description: string;
  recordedBy: string;
}

export interface FarmSettings {
  milkPricePerLitre: number;
  eggPricePerUnit: number;
  waterPricePerUnit: number;
  availableCrops: string[];
  cropPrices?: Record<string, number>;
  updatedAt: string;
}

export interface PoultryEntry {
  id: string;
  date: string;
  eggCount: number;
  feedConsumed: number;
  recordedBy: string;
}

export interface Sale {
  id: string;
  date: string;
  productType: string;
  customer: string;
  customerPhone?: string;
  quantity: number;
  totalPrice: number;
  paymentStatus: 'paid' | 'outstanding';
  managerUid: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  status: 'operational' | 'maintenance' | 'broken';
  lastService?: string;
  health?: number;
}

export interface ServiceRecord {
  id: string;
  equipmentId: string;
  serviceDate: string;
  performedBy: string;
  notes: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedToUid: string;
  dueDate: string;
  status: 'to-do' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}
