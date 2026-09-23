export interface EventPhoto {
  id: string;
  url: string;
  caption: string;
  takenAt: string;
  eventId: string;
  eventTitle: string;
  residentIds: string[]; // Face IDs mapped to this photo
  tags: string[];
  photographer?: string;
  highResUrl?: string;
}

export interface FestivalEvent {
  id: string;
  title: string;
  hindiTitle: string;
  date: string;
  year: number;
  location: string;
  attendeesCount: number;
  photoCount: number;
  coverImage: string;
  colorAccent: string;
  description: string;
  highlights: string[];
  photos: EventPhoto[];
  driveUrl?: string;
}

export interface FaceScanResult {
  photo: EventPhoto;
  similarity: number; // 0 - 100 percentage
  faceBox: {
    top: number; // percentage
    left: number;
    width: number;
    height: number;
  };
  matchedFeatures: string[];
}

export interface BulkUploadFile {
  id: string;
  name: string;
  originalSize: number; // in bytes
  compressedSize: number;
  previewUrl: string;
  status: 'queued' | 'compressing' | 'indexing_faces' | 'uploaded' | 'error';
  progress: number; // 0 - 100
  facesDetected: number;
}

export type FestiveTheme = 'deepotsav' | 'rangotsav' | 'dandiya' | 'ganesh';

export interface EventRsvpRecord {
  id: string;
  eventId: string;
  residentName: string;
  bungalowPlot: string;
  phone: string;
  adultsCount: number;
  kidsCount: number;
  dietPreference: 'regular' | 'jain' | 'falahar';
  isAttending: boolean;
  notes?: string;
  createdAt: string;
}


export interface CommitteeMember {
  id: string;
  name: string;
  hindiName: string;
  designation: string;
  hindiDesignation: string;
  roleType?: 'founder' | 'president' | 'vice_president' | 'secretary' | 'treasurer' | 'cultural' | 'youth' | 'senior' | 'patron';
  wing: 'executive' | 'cultural' | 'youth' | 'senior';
  phone: string;
  plotNo: string;
  avatar: string;
  shortIntro?: string;
  hindiShortIntro?: string;
  tenure?: string;
}

export interface EmergencyContact {
  id: string;
  title: string;
  hindiTitle: string;
  role: string;
  phone: string;
  availability: string;
  iconType: 'shield' | 'temple' | 'ambulance' | 'zap' | 'wrench';
}
