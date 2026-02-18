export interface DataItem {
    id: string;
    name: string;
    description?: string;
    presented?: boolean;
    appreciated?: boolean;
    wanted?: boolean;
    [key: string]: string | boolean | undefined;
  }
  
  export interface DeviceData {
    sondes: DataItem[];
    features: DataItem[];
    hardware: DataItem[];
    connex: DataItem[];
  }
  