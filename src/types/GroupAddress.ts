export interface GroupAddress {
  id: string;
  address: string;
  name: string;
  description: string;
  dpt: string;
  comment: string;
}

export interface DPTType {
  code: string;
  label: string;
  description?: string;
}
