export interface Area {
  id: string;
  name: string;
  region: string;
}

export interface AreaGroup {
  region: string;
  areas: Area[];
}

export interface Station {
  id: string;
  name: string;
}

export interface TrainLine {
  id: string;
  name: string;
  company: string;
  stations: Station[];
}

export interface TrainLineGroup {
  company: string;
  lines: TrainLine[];
}

export interface SelectedLocation {
  id: string;
  name: string;
  type: "area" | "station";
}
