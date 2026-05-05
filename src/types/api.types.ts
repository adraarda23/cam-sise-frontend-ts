export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// Collection Request Types
export interface CreateManualRequestRequest {
  fillerId: number;
  assetType: 'PALLET' | 'SEPARATOR';
  estimatedQuantity: number;
  requestingUserId?: number;
}

export interface CollectionRequest {
  id: number;
  fillerId: number;
  assetType: 'PALLET' | 'SEPARATOR';
  estimatedQuantity: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  approvedByUserId?: number;
  rejectionReason?: string;
  source?: string;
  collectionPlanId?: number | null;
}

// Stock Types
export interface RecordInflowRequest {
  fillerId: number;
  assetType: 'PALLET' | 'SEPARATOR';
  quantity: number;
  referenceId?: string;
}

export interface FillerStock {
  id: number;
  fillerId: number;
  assetType: 'PALLET' | 'SEPARATOR';
  currentQuantity: number;
  thresholdQuantity: number;
  estimatedLossRate: {
    percentage: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Route Optimization Types
export interface OptimizeRouteRequest {
  depotId: number;
  plannedDate?: string;
}

export interface MultiVehicleOptimizeRequest {
  depotId: number;
  plannedDate?: string;
  maxVehicles?: number;
}

export interface CollectionPlan {
  id: number;
  depotId: number;
  vehicleId?: number;
  plannedDate: string;
  status: 'GENERATED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  totalDistance: { kilometers: number };
  estimatedDuration: { minutes: number };
  routeStopsJson: string;
  totalCapacityPallets: number;
  totalCapacitySeparators: number;
  createdAt: string;
}

export interface MultiVehicleOptimizeResponse {
  plans: CollectionPlan[];
  vehiclesUsed: number;
  totalDistanceKm: number;
  totalPallets: number;
  totalSeparators: number;
}

export interface RouteStop {
  sequence: number;
  fillerId: number;
  fillerName: string;
  latitude: number;
  longitude: number;
  estimatedPallets: number;
  estimatedSeparators: number;
}

// Filler Types
export interface RegisterFillerRequest {
  poolOperatorId: number;
  name: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  contactPhone: string;
  contactEmail: string;
  contactPersonName: string;
  taxId: string;
}

export interface Filler {
  id: number;
  poolOperatorId: number;
  name: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    fullAddress: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  contactInfo: {
    phone: string;
    email: string;
    contactPersonName: string;
  };
  taxId: {
    value: string;
  };
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Pool Operator Types
export interface PoolOperator {
  id: number;
  name: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  contactPhone: string;
  contactEmail: string;
  contactPersonName: string;
  active: boolean;
}

// Vehicle Types
export interface Vehicle {
  id: number;
  depotId: number;
  vehicleTypeId: number;
  plateNumber: string;
  status: 'AVAILABLE' | 'ON_ROUTE' | 'MAINTENANCE' | 'INACTIVE';
  currentDriver?: {
    name: string;
    licenseNumber: string;
    phone: string;
  };
  currentCollectionPlanId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterVehicleRequest {
  depotId: number;
  vehicleTypeId: number;
  plateNumber: string;
}

export interface AssignToRouteRequest {
  collectionPlanId: number;
  driverName: string;
  licenseNumber: string;
  phone: string;
}

// Depot Types
export interface Depot {
  id: number;
  poolOperatorId: number;
  name: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    fullAddress: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  active: boolean;
  vehicleIds: number[];
  createdAt: string;
  updatedAt: string;
}

// Company Settings Types
export interface CompanySettings {
  minPalletRequestQty: number;
  minSeparatorRequestQty: number;
}

// Analytics Types
export interface AnalyticsSummary {
  totalRequests: number;
  requestsByStatus: Record<string, number>;
  palletRequests: number;
  separatorRequests: number;
  totalPlans: number;
  plansByStatus: Record<string, number>;
  avgDistanceKm: number;
  avgDurationMinutes: number;
  totalFillers: number;
  totalPalletStock: number;
  totalSeparatorStock: number;
  fillersWithLowPalletStock: number;
  fillersWithLowSeparatorStock: number;
}

// Vehicle Type Types
export interface VehicleType {
  id: number;
  poolOperatorId: number;
  name: string;
  description: string;
  capacity: {
    pallets: number;
    separators: number;
  };
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
