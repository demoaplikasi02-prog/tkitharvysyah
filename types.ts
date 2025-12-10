
export interface Teacher {
  Name: string;
  Phone: string;
  Class: string;
  "Link Photo"?: string;
}

export interface Student {
  Name: string;
  NISN: string;
  Class: string;
  "Link Photo"?: string;
}

export interface Principal {
  Name: string;
  Phone: string;
  "Link Photo"?: string;
}

export interface Score {
  "Student ID": string;
  Category: string;
  "Item Name": string;
  Score: string;
  Date: string;
  Notes: string;
  Timestamp?: string;
  Semester?: string;
  "Teacher Name"?: string;
}

export interface Hafalan {
  Category: 'Hafalan Surah Pendek' | 'Hafalan Doa Sehari-hari' | 'Hafalan Hadist';
  ItemName: string;
  Semester?: string;
}

export interface SPP {
  NISN: string;
  Bulan: string;
  Nominal: string;
  Status: string;
  "Tanggal Bayar": string;
  Kategori?: string;
}