from fastapi import APIRouter

router = APIRouter()

CAMPUS_LOCATIONS = {
    "library": "GITAM Central Library — quiet study zones, book sections, and digital resources",
    "admin_block": "Administrative Block — admissions, fees, registrar, and student services",
    "cse_department": "Computer Science & Engineering Department — labs, faculty offices, and lecture halls",
    "canteen": "University Canteen & Food Court — snacks, meals, and refreshments",
    "sports_complex": "Sports Complex — indoor courts, gymnasium, and outdoor fields",
    "auditorium": "Main Auditorium — events, seminars, and cultural programs",
    "hostel_block": "Student Hostels — accommodation, warden office, and common rooms",
    "parking": "Campus Parking — visitor parking, bike stands, and shuttle stop",
}


@router.get("/locations")
async def get_locations():
    return CAMPUS_LOCATIONS
