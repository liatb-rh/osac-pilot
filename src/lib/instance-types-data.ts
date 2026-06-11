// VM instance types (flavors) — predefined t-shirt sizes with optional custom additions.
// VM only; clusters and bare metal use their own profiles.

export type InstanceTypeCategory = "general" | "compute" | "memory";

export interface InstanceType {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  category: InstanceTypeCategory;
  cpu: number;
  memoryGib: number;
  bootDiskGib: number;
  builtIn: boolean;
}

export const CATEGORY_LABELS: Record<InstanceTypeCategory, string> = {
  general: "General purpose",
  compute: "Compute optimized",
  memory: "Memory optimized",
};

const SEED: InstanceType[] = [
  { id: "it-small",     name: "small",     displayName: "Small",             category: "general", cpu: 2,  memoryGib: 8,   bootDiskGib: 64,  builtIn: true, description: "Lightweight services and dev workloads." },
  { id: "it-medium",    name: "medium",    displayName: "Medium",            category: "general", cpu: 4,  memoryGib: 16,  bootDiskGib: 128, builtIn: true, description: "Balanced default for application tiers." },
  { id: "it-large",     name: "large",     displayName: "Large",             category: "general", cpu: 8,  memoryGib: 32,  bootDiskGib: 256, builtIn: true, description: "General-purpose workloads needing headroom." },
  { id: "it-xlarge",    name: "xlarge",    displayName: "Extra Large",       category: "general", cpu: 16, memoryGib: 64,  bootDiskGib: 512, builtIn: true, description: "Demanding multi-service hosts." },
  { id: "it-compute-l", name: "compute-l", displayName: "Compute · Large",   category: "compute", cpu: 16, memoryGib: 32,  bootDiskGib: 128, builtIn: true, description: "CPU-bound services with modest RAM." },
  { id: "it-memory-l",  name: "memory-l",  displayName: "Memory · Large",    category: "memory",  cpu: 8,  memoryGib: 64,  bootDiskGib: 256, builtIn: true, description: "In-memory caches and analytics." },
];

// In-memory store; mutated by the Provider Catalog Items wizard at runtime.
const STORE: InstanceType[] = [...SEED];

export function listInstanceTypes(): InstanceType[] {
  return [...STORE].sort((a, b) =>
    a.category === b.category ? a.cpu - b.cpu : a.category.localeCompare(b.category)
  );
}

export function findInstanceType(id?: string): InstanceType | undefined {
  if (!id) return undefined;
  return STORE.find((i) => i.id === id);
}

export function addInstanceType(it: Omit<InstanceType, "id" | "builtIn"> & { id?: string }): InstanceType {
  const id = it.id ?? `it-${it.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.random().toString(36).slice(2, 6)}`;
  const created: InstanceType = { ...it, id, builtIn: false };
  STORE.push(created);
  return created;
}

export function formatInstanceType(it: InstanceType): string {
  return `${it.displayName} · ${it.cpu} vCPU · ${it.memoryGib} GiB · ${it.bootDiskGib} GiB disk`;
}
