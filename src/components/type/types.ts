export interface DataItem {
    id: string;
    name: string;
    description?: string;
    presented?: boolean;
    appreciated?: boolean;
    wanted?: boolean;
    [key: string]: any;
  }
  
  export interface DeviceData {
    sondes: DataItem[];
    features: DataItem[];
    hardware: DataItem[];
    connex: DataItem[];
  }
  