import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Phone, Mail } from 'lucide-react';

// Custom marker icon
const customIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Agency {
  id: string;
  name: string;
  type: 'siege' | 'service';
  address: string;
  phone: string;
  email?: string;
  lat: number;
  lng: number;
}

const agencies: Agency[] = [
  {
    id: '1',
    name: 'SanlamAllianz Vie',
    type: 'siege',
    address: '2 Boulevard Roume, Plateau, 01 BP 1741 Abidjan 01',
    phone: '(+225) 27 20 25 97 00',
    email: 'saci-infovie@sanlamallianz.com',
    lat: 5.3225,
    lng: -4.0210
  },
  {
    id: '2',
    name: 'SanlamAllianz Non-Vie',
    type: 'siege',
    address: '3 Boulevard Roume, Plateau, 01 BP 3832 Abidjan 01',
    phone: '(+225) 27 20 25 36 00',
    email: 'saci-infos@sanlamallianz.com',
    lat: 5.3220,
    lng: -4.0215
  },
  {
    id: '3',
    name: 'Relation Client',
    type: 'siege',
    address: '3 Boulevard Roume, Plateau, 01 BP 3832 Abidjan 01',
    phone: '(+225) 27 20 27 77 77',
    email: 'saci-relationclient@sanlamallianz.com',
    lat: 5.3218,
    lng: -4.0220
  },
  {
    id: '4',
    name: 'Espace Service Cocody - 2 Plateaux',
    type: 'service',
    address: 'Boulevard Latrille, voisin Lunetterie Alain Afflelou',
    phone: '07 48 35 44 51',
    lat: 5.3590,
    lng: -3.9870
  },
  {
    id: '5',
    name: 'Espace Service Cocody - II Plateaux',
    type: 'service',
    address: 'Bd Latrille, face Patisserie Abidjanaise',
    phone: '07 07 93 52 14',
    lat: 5.3550,
    lng: -3.9920
  },
  {
    id: '6',
    name: 'Espace Service Koumassi',
    type: 'service',
    address: 'Boulevard VGE, Immeuble Privilège 2020',
    phone: '07 07 90 64 80',
    lat: 5.2960,
    lng: -3.9510
  },
  {
    id: '7',
    name: 'Espace Service Plateau',
    type: 'service',
    address: '2, Boulevard Roume',
    phone: '27 20 25 36 00',
    lat: 5.3230,
    lng: -4.0205
  }
];

const AgenciesMap = () => {
  // Center on Abidjan
  const center: [number, number] = [5.3200, -4.0000];

  return (
    <div className="rounded-2xl overflow-hidden border bg-card shadow-soft">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: '450px', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {agencies.map((agency) => (
          <Marker
            key={agency.id}
            position={[agency.lat, agency.lng]}
            icon={customIcon}
          >
            <Popup>
              <div className="min-w-[200px] p-1">
                <h4 className="font-bold text-primary text-sm mb-2">{agency.name}</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{agency.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                    <a href={`tel:${agency.phone.replace(/\s/g, '')}`} className="text-foreground hover:text-primary">
                      {agency.phone}
                    </a>
                  </div>
                  {agency.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                      <a href={`mailto:${agency.email}`} className="text-foreground hover:text-primary break-all">
                        {agency.email}
                      </a>
                    </div>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    agency.type === 'siege' 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-accent/10 text-accent'
                  }`}>
                    {agency.type === 'siege' ? 'Siège' : 'Espace Service'}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default AgenciesMap;
