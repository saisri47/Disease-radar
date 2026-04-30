import json
import os
from functools import lru_cache
from math import asin, cos, radians, sin, sqrt
from typing import Dict, List, Tuple
from urllib.parse import urlencode
from urllib.request import Request, urlopen


DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "hospitals.json")
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
REQUEST_HEADERS = {
    "User-Agent": "DiseaseRadar/1.0 (hospital lookup)",
    "Accept": "application/json",
}


@lru_cache(maxsize=1)
def _load_hospital_data():
    with open(DATA_PATH, "r", encoding="utf-8") as file:
        return json.load(file)


def _fetch_json(url: str, params: Dict[str, str]) -> List[dict] | dict:
    query_url = f"{url}?{urlencode(params)}"
    request = Request(query_url, headers=REQUEST_HEADERS)
    with urlopen(request, timeout=8) as response:
        return json.loads(response.read().decode("utf-8"))


@lru_cache(maxsize=64)
def _geocode_pincode(pincode: str) -> Tuple[float, float] | None:
    payload = _fetch_json(
        NOMINATIM_URL,
        {
            "postalcode": pincode,
            "countrycodes": "in",
            "format": "jsonv2",
            "limit": "1",
        },
    )
    if not payload:
        return None

    result = payload[0]
    return float(result["lat"]), float(result["lon"])


@lru_cache(maxsize=64)
def _reverse_geocode(lat: float, lon: float) -> Dict[str, str] | None:
    payload = _fetch_json(
        NOMINATIM_REVERSE_URL,
        {
            "lat": f"{lat}",
            "lon": f"{lon}",
            "format": "jsonv2",
            "addressdetails": "1",
        },
    )
    if not payload:
        return None

    address = payload.get("address", {})
    return {
        "pincode": address.get("postcode", "Unknown"),
        "display_name": payload.get("display_name", "Current location"),
    }


def _summarize_display_name(display_name: str | None) -> str:
    if not display_name:
        return "Current area"

    parts = [part.strip() for part in display_name.split(",") if part.strip()]
    if not parts:
        return "Current area"

    preferred_parts = parts[:3]
    return ", ".join(preferred_parts)


def resolve_location_context(latitude: float, longitude: float) -> dict:
    try:
        reverse_result = _reverse_geocode(latitude, longitude)
        if reverse_result:
            return {
                "pincode": reverse_result["pincode"],
                "display_name": _summarize_display_name(reverse_result["display_name"]),
                "source": "live",
            }
    except Exception:
        pass

    nearest_pincode = None
    nearest_distance = None
    nearest_facility = None
    for area_pincode, facilities in _load_hospital_data().items():
        if area_pincode == "default":
            continue
        for facility in facilities:
            facility_lat = facility.get("latitude")
            facility_lon = facility.get("longitude")
            if facility_lat is None or facility_lon is None:
                continue
            distance_km = _distance_km(latitude, longitude, facility_lat, facility_lon)
            if nearest_distance is None or distance_km < nearest_distance:
                nearest_distance = distance_km
                nearest_pincode = area_pincode
                nearest_facility = facility

    if nearest_pincode and nearest_facility:
        return {
            "pincode": nearest_pincode,
            "display_name": nearest_facility.get("address") or nearest_pincode,
            "source": "fallback",
        }

    return {
        "pincode": "Unknown",
        "display_name": "Current area",
        "source": "unavailable",
    }


def _format_place_name(value: str | None) -> str | None:
    if not value:
        return None

    words = value.strip().split()
    if not words:
        return None

    formatted_words = []
    for word in words:
        if len(word) <= 4 and word.isupper():
            formatted_words.append(word)
        else:
            formatted_words.append(word.capitalize())
    return " ".join(formatted_words)


def _clean_common_typos(value: str | None) -> str | None:
    if not value:
        return value

    replacements = {
        "healtth": "health",
        "hosptial": "hospital",
        "medicl": "medical",
        "clinc": "clinic",
    }
    cleaned = value
    for source, target in replacements.items():
        cleaned = cleaned.replace(source, target).replace(source.title(), target.title())
    return cleaned


def _format_facility_name(name: str) -> str:
    cleaned_name = _clean_common_typos(name) or name
    parts = [_format_place_name(part) or part for part in cleaned_name.split()]
    return " ".join(parts)


def _extract_address(tags: Dict[str, str]) -> str:
    address_parts = [
        _clean_common_typos(tags.get("addr:housenumber")),
        _clean_common_typos(tags.get("addr:street")),
        _clean_common_typos(tags.get("addr:suburb")),
        _clean_common_typos(tags.get("addr:city")),
    ]
    address = ", ".join(part for part in address_parts if part)
    if address:
        return address

    area_parts = [
        _clean_common_typos(tags.get("addr:suburb")),
        _clean_common_typos(tags.get("addr:place")),
        _clean_common_typos(tags.get("addr:district")),
        _clean_common_typos(tags.get("addr:state")),
    ]
    area_label = ", ".join(part for part in area_parts if part)
    return area_label or ""


def _extract_specialty(tags: Dict[str, str], fallback_specialty: str) -> str:
    specialty = (
        tags.get("healthcare:speciality")
        or tags.get("healthcare:specialty")
        or tags.get("healthcare")
        or fallback_specialty
    )
    return _format_place_name(specialty) or fallback_specialty


def _extract_phone(tags: Dict[str, str]) -> str | None:
    return (
        tags.get("phone")
        or tags.get("contact:phone")
        or tags.get("contact:mobile")
        or tags.get("mobile")
    )


def _facility_type_from_tags(tags: Dict[str, str]) -> str:
    amenity = (tags.get("amenity") or "").lower()
    healthcare = (tags.get("healthcare") or "").lower()

    if amenity == "hospital" or healthcare == "hospital":
        return "Hospital"
    if amenity == "doctors" or healthcare in {"doctor", "physician"}:
        return "Doctor"
    return "Clinic"


def _preferred_specialty(predictions: List[dict]) -> str:
    if not predictions:
        return "General Medicine"

    category = predictions[0]["category"].lower()
    if "respiratory" in category:
        return "Pulmonology"
    if "gastro" in category:
        return "General Medicine"
    return "General Medicine"


def _distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    earth_radius_km = 6371.0
    lat1_rad, lon1_rad, lat2_rad, lon2_rad = map(radians, [lat1, lon1, lat2, lon2])
    delta_lat = lat2_rad - lat1_rad
    delta_lon = lon2_rad - lon1_rad
    haversine = sin(delta_lat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lon / 2) ** 2
    return 2 * earth_radius_km * asin(sqrt(haversine))


def _live_hospital_lookup(
    urgency_level: str,
    predictions: List[dict],
    pincode: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
) -> Tuple[List[dict], str]:
    coordinates = None
    resolved_location = pincode or "Unknown"

    if latitude is not None and longitude is not None:
        coordinates = (latitude, longitude)
        reverse_result = _reverse_geocode(latitude, longitude)
        if reverse_result:
            resolved_location = reverse_result["pincode"]
    elif pincode:
        coordinates = _geocode_pincode(pincode)
        resolved_location = pincode

    if not coordinates:
        return [], resolved_location

    lat, lon = coordinates
    radius_candidates = [7000, 12000] if urgency_level == "Emergency" else [8000, 15000]
    specialty = _preferred_specialty(predictions)
    facilities = []
    seen = set()

    for radius in radius_candidates:
        overpass_query = f"""
        [out:json][timeout:10];
        (
          node["amenity"~"hospital|clinic|doctors"](around:{radius},{lat},{lon});
          way["amenity"~"hospital|clinic|doctors"](around:{radius},{lat},{lon});
          relation["amenity"~"hospital|clinic|doctors"](around:{radius},{lat},{lon});
          node["healthcare"~"hospital|clinic|doctor|physician"](around:{radius},{lat},{lon});
          way["healthcare"~"hospital|clinic|doctor|physician"](around:{radius},{lat},{lon});
          relation["healthcare"~"hospital|clinic|doctor|physician"](around:{radius},{lat},{lon});
        );
        out center tags 12;
        """.strip()
        payload = _fetch_json(OVERPASS_URL, {"data": overpass_query})

        for element in payload.get("elements", []):
            tags = element.get("tags", {})
            name = tags.get("name")
            facility_type = _facility_type_from_tags(tags)
            if not name:
                continue

            key = (name.lower(), facility_type.lower())
            if key in seen:
                continue
            seen.add(key)

            facilities.append(
                {
                    "name": _format_facility_name(name),
                    "facility_type": facility_type,
                    "pincode": tags.get("addr:postcode", resolved_location),
                    "address": _extract_address(tags),
                    "phone": _extract_phone(tags),
                    "specialty": _extract_specialty(tags, specialty),
                    "data_source": "live",
                }
            )

        if facilities:
            break

    if urgency_level == "Emergency":
        facilities = [
            facility
            for facility in facilities
            if facility["facility_type"].lower() == "hospital"
        ] or facilities

    if specialty == "Pulmonology":
        facilities.sort(
            key=lambda facility: specialty.lower() not in facility.get("specialty", "").lower()
        )

    return facilities[:5], resolved_location


def _fallback_hospital_lookup(
    pincode: str | None,
    urgency_level: str,
    predictions: List[dict],
    latitude: float | None = None,
    longitude: float | None = None,
) -> List[dict]:
    data = _load_hospital_data()
    facilities = []

    target_pincode = pincode
    if target_pincode:
        facilities = data.get(target_pincode, [])

    if not facilities and latitude is not None and longitude is not None:
        nearby_facilities = []
        for area_pincode, area_facilities in data.items():
            if area_pincode == "default":
                continue
            for facility in area_facilities:
                facility_lat = facility.get("latitude")
                facility_lon = facility.get("longitude")
                if facility_lat is None or facility_lon is None:
                    continue
                distance_km = _distance_km(latitude, longitude, facility_lat, facility_lon)
                if distance_km <= 25:
                    nearby_facilities.append(
                        {
                            **facility,
                            "distance_km": round(distance_km, 1),
                        }
                    )
        facilities = sorted(nearby_facilities, key=lambda facility: facility.get("distance_km", 9999))

    if not facilities:
        return []

    facilities = [{**facility, "data_source": "fallback"} for facility in facilities]

    if urgency_level == "Emergency":
        facilities = [
            facility
            for facility in facilities
            if facility["facility_type"].lower() == "hospital"
        ] or facilities

    if predictions:
        category = predictions[0]["category"].lower()
        if "respiratory" in category:
            facilities = sorted(
                facilities,
                key=lambda facility: "pulmonology" not in facility.get("specialty", "").lower()
            )

    return facilities[:5]


def get_nearby_hospitals(
    pincode: str | None,
    urgency_level: str,
    predictions: List[dict],
    latitude: float | None = None,
    longitude: float | None = None,
) -> dict:
    live_error = None
    resolved_location = pincode or "Unavailable"

    if latitude is not None and longitude is not None:
        try:
            live_results, resolved_location = _live_hospital_lookup(
                urgency_level,
                predictions,
                pincode=pincode,
                latitude=latitude,
                longitude=longitude,
            )
            if live_results:
                return {
                    "source": "live",
                    "resolved_pincode": resolved_location,
                    "facilities": live_results,
                    "reason": "Live map lookup succeeded.",
                    "error": None,
                }
            live_error = "Live map lookup returned no nearby facilities for the resolved area."
        except Exception as exc:
            live_error = f"Live map lookup failed: {exc}"
    elif pincode:
        try:
            live_results, resolved_location = _live_hospital_lookup(
                urgency_level,
                predictions,
                pincode=pincode,
            )
            if live_results:
                return {
                    "source": "live",
                    "resolved_pincode": resolved_location,
                    "facilities": live_results,
                    "reason": "Live map lookup succeeded.",
                    "error": None,
                }
            live_error = "Live map lookup returned no nearby facilities for the resolved area."
        except Exception as exc:
            live_error = f"Live map lookup failed: {exc}"
    else:
        live_error = "No coordinates or fallback pincode were provided."

    fallback_pincode = resolved_location if resolved_location not in {"Unknown", "Unavailable"} else pincode
    fallback_results = _fallback_hospital_lookup(
        fallback_pincode,
        urgency_level,
        predictions,
        latitude=latitude,
        longitude=longitude,
    )
    if fallback_results:
        return {
            "source": "fallback",
            "resolved_pincode": fallback_pincode or resolved_location,
            "facilities": fallback_results,
            "reason": "Using the local fallback hospital directory for the resolved current location.",
            "error": live_error,
        }

    if not fallback_results:
        return {
            "source": "unavailable",
            "resolved_pincode": fallback_pincode or resolved_location,
            "facilities": [],
            "reason": live_error or "No hospital source returned usable data.",
            "error": live_error,
        }
