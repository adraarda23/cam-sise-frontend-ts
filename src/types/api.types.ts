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
    stdDev?: number;
    sampleSize?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ForecastResponse {
  mean: number;
  stdDev: number;
  lowerBound: number;
  upperBound: number;
  sampleSize: number;
  confidenceLevel: number;
  formatted: string;
  daysUntilThreshold: number;
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
  routeGeometryJson?: string | null;
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
  medianDistanceKm: number;
  p95DistanceKm: number;
  stdDevDistanceKm: number;
  totalFillers: number;
  totalPalletStock: number;
  totalSeparatorStock: number;
  fillersWithLowPalletStock: number;
  fillersWithLowSeparatorStock: number;
  medianFillerStockPallet: number;
  p95FillerStockPallet: number;
  stdDevFillerStockPallet: number;
  anomalyCount24h: number;
  criticalAnomalyCount24h: number;
  unreadNotificationCount: number;
}

// Notification Types
export interface NotificationItem {
  id: number;
  recipientUserId: number | null;
  poolOperatorId: number | null;
  fillerId: number | null;
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  body: string | null;
  actionUrl: string | null;
  read: boolean;
  emailSent: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationListResponse {
  content: NotificationItem[];
  totalElements: number;
  totalPages: number;
  page: number;
}

// Fleet suggestion
export interface FleetVehicleAssignment {
  vehicleTypeId: number;
  vehicleTypeName: string;
  count: number;
  capacityPerVehicle: { pallets: number; separators: number };
}

export interface FleetComposition {
  label: string;
  reason: string;
  assignments: FleetVehicleAssignment[];
  totalCapacity: { pallets: number; separators: number };
  totalDemand: { pallets: number; separators: number };
  estimatedCostTRY: number;
  slackPercent: number;
  vehicleCount: number;
}

export interface SuggestFleetRequest {
  depotId?: number;
  estimatedRouteKm?: number;
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
