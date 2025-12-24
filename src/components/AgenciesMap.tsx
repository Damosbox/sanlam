import { useEffect, useRef } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Agency {
  id: string;
  name: string;
  type: "siege" | "service";
  address: string;
  phone: string;
  email?: string;
  lat: number;
  lng: number;
}

const agencies: Agency[] = [
  {
    id: "1",
    name: "SanlamAllianz Vie",
    type: "siege",
    address: "2 Boulevard Roume, Plateau, 01 BP 1741 Abidjan 01",
    phone: "(+225) 27 20 25 97 00",
    email: "saci-infovie@sanlamallianz.com",
    lat: 5.3225,
    lng: -4.021,
  },
  {
    id: "2",
    name: "SanlamAllianz Non-Vie",
    type: "siege",
    address: "3 Boulevard Roume, Plateau, 01 BP 3832 Abidjan 01",
    phone: "(+225) 27 20 25 36 00",
    email: "saci-infos@sanlamallianz.com",
    lat: 5.322,
    lng: -4.0215,
  },
  {
    id: "3",
    name: "Relation Client",
    type: "siege",
    address: "3 Boulevard Roume, Plateau, 01 BP 3832 Abidjan 01",
    phone: "(+225) 27 20 27 77 77",
    email: "saci-relationclient@sanlamallianz.com",
    lat: 5.3218,
    lng: -4.022,
  },
  {
    id: "4",
    name: "Espace Service Cocody - 2 Plateaux",
    type: "service",
    address: "Boulevard Latrille, voisin Lunetterie Alain Afflelou",
    phone: "07 48 35 44 51",
    lat: 5.359,
    lng: -3.987,
  },
  {
    id: "5",
    name: "Espace Service Cocody - II Plateaux",
    type: "service",
    address: "Bd Latrille, face Patisserie Abidjanaise",
    phone: "07 07 93 52 14",
    lat: 5.355,
    lng: -3.992,
  },
  {
    id: "6",
    name: "Espace Service Koumassi",
    type: "service",
    address: "Boulevard VGE, Immeuble Privilège 2020",
    phone: "07 07 90 64 80",
    lat: 5.296,
    lng: -3.951,
  },
  {
    id: "7",
    name: "Espace Service Plateau",
    type: "service",
    address: "2, Boulevard Roume",
    phone: "27 20 25 36 00",
    lat: 5.323,
    lng: -4.0205,
  },
];

function phoneToTel(phone: string) {
  return phone.replace(/[^+\d]/g, "");
}

const AgenciesMap = () => {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapDivRef.current) return;
    if (mapRef.current) return;

    const icon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const map = L.map(mapDivRef.current, {
      center: [5.32, -4.0],
      zoom: 12,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    agencies.forEach((a) => {
      const badge = a.type === "siege" ? "Siège" : "Espace Service";
      const popupHtml = `
        <div style="min-width:220px">
          <div style="font-weight:700; margin-bottom:6px;">${a.name}</div>
          <div style="font-size:12px; color:#555; margin-bottom:6px;">${a.address}</div>
          <div style="font-size:12px; margin-bottom:4px;">
            <a href="tel:${phoneToTel(a.phone)}" style="text-decoration:none; color:inherit;">Tél : ${a.phone}</a>
          </div>
          ${a.email ? `<div style="font-size:12px; margin-bottom:6px;"><a href="mailto:${a.email}" style="text-decoration:none; color:inherit;">Email: ${a.email}</a></div>` : ""}
          <div style="font-size:11px; opacity:0.85; border-top:1px solid #eee; padding-top:6px;">${badge}</div>
        </div>
      `;

      L.marker([a.lat, a.lng], { icon }).addTo(map).bindPopup(popupHtml);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="rounded-2xl overflow-hidden border bg-card shadow-soft">
      <div
        ref={mapDivRef}
        className="w-full"
        style={{ height: 450 }}
        aria-label="Carte des agences en Côte d'Ivoire"
      />
    </div>
  );
};

export default AgenciesMap;
