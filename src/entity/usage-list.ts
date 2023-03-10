export interface IUsage {
  id?: number;
  app_name?: string;
  title?: string;
  url?: string;
  usage_info_id?: number;
  start_date?: string;
  end_date?: string;
  duration?: number;
  created_date?: string;
}

export interface IGetUsageListParam {
  limit: number;
  offset: number;
}

export interface IGetUsageListRes {
  result: Array<IUsage>;
  count: {
    'COUNT(1)': number;
  };
}
