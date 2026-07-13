const supabase = require('../supabaseClient');

// 🚨 GET /api/students/emergency-guide
// Fetches real emergency contacts and embassy hotlines from the database
exports.getEmergencyGuides = async (req, res, next) => {
    try {
        // Query your real 'emergency_contact' table
        const { data: contacts, error: contactError } = await supabase
            .from('emergency_contact')
            .select('*');

        if (contactError) throw contactError;

        // Structured response incorporating required quick access controls and embassy info
        const emergencyDashboard = {
            quick_access: {
                police: "112",
                fire_and_rescue: "119",
                immigration_hotline: "1345"
            },
            database_contacts: contacts || [],
            visa_offices: [
                { name: "Busan Immigration Office", Unit: "Main Branch", phone: "051-461-3000", address: "Busan, Jung-gu, Jungang-daero 146" }
            ],
            jeonse_fraud_prevention: {
                notice: "Before signing any housing contract, check the Certified Copy of Real Estate Register (등기부등본) to secure your deposit."
            }
        };

        return res.status(200).json({ success: true, data: emergencyDashboard });
    } catch (error) {
        next(error);
    }
};

// 🚌 GET /api/students/campus-facilities
// Fetches physical infrastructure locations and shuttle metadata
exports.getCampusFacilities = async (req, res, next) => {
    try {
        // Query your real 'facility' table
        const { data: facilities, error: facilityError } = await supabase
            .from('facility')
            .select('*');

        if (facilityError) throw facilityError;

        const campusMapData = {
            shuttle_bus_metadata: {
                fare: "450 KRW (Cash) / Card Transfer discounts apply",
                intervals: "5 mins (Peak Hours) / 10 mins (Regular Hours)",
                key_stops: [
                    "PNU Subway Station Exit 3", "PNU Main Gate", 
                    "Main Administration Building", "Moonchang Hall", 
                    "Central Library", "Kyungam Gymnasium"
                ]
            },
            registered_facilities: facilities || []
        };

        return res.status(200).json({ success: true, data: campusMapData });
    } catch (error) {
        next(error);
    }
};