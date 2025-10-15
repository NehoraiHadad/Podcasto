export interface CardGridLoadingProps {
  count?: number;
  columns?: 1 | 2 | 3 | 4;
  showHeader?: boolean;
}

export interface TableLoadingProps {
  rows?: number;
  columns?: number;
}

export interface FormLoadingProps {
  fields?: number;
}

export interface DetailsLoadingProps {
  showHeader?: boolean;
}
