//customers
const customerDetails = [
    "id",
    "firstName",
    "lastName",
    "email",
    "phone",
    "profile_picture",
    "isPhoneVerified",
    "payment_mode",
    "currency",
    "accountStatus",
    "country"
  ],
  //drivers
  driverDetails = [
    "id",
    "firstName",
    "lastName",
    "email",
    "phone",
    "profile_picture",
    "drivers_license_front",
    "drivers_license_back",
    "isPhoneVerified",
    "isOnline",
    "vehicleId",
    "accountStatus",
    "country",
    "createdAt"

  ],
  //carOwners
  carOwnerDetails = [
    "id",
    "firstName",
    "lastName",
    "email",
    "phone",
    "isEmailVerified",
    "profile_picture",
    "accountStatus",
    "country"
  ],
  //admin
  adminDetails = [
    "id",
    "firstName",
    "lastName",
    "email",
    "role",
    "needsPasswordReset",
    "phone",
    "profile_picture",
    "isEmailVerified",
    "country",
    "accountStatus"
  ],
  vehicleTypeDetails = ["id", "vehicle_type", "base_charge", "picture", "tripCharge", "currency"],
  //vehicle
  vehicleDetails = [
    "id",
    "vehicleTypeId",
    "vehicle_name",
    "model_and_year",
    "plate_number",
    "registration_certificate",
    "isApproved",
    "driverId",
    "vehicleTypeDetails",
    "certificate_of_inspection",
    "insurance_certificate",
    "vehicle_image_front_view",
    "vehicle_image_back_view",
    "ownerId",
    "createdAt",
    "approvedOrDisapprovedAt",
    "VehicleStatus"
  ],
  //ride requests
  rideRequestFullDetails = [
    "id",
    "rideOrderId",
    "pickup_coordinates",
    "destination_coordinates",
    "pickup_location",
    "pickup_latitude",
    "pickup_longitude",
    "destination",
    "destination_latitude",
    "destination_longitude",
    "vehicleTypeId",
    "calculated_distance",
    "final_distance",
    "calculated_duration",
    "final_duration",
    "calculated_amount",
    "final_amount",
    "paymentStatus",
    "trip_start_at",
    "trip_status",
    "modeOfPayment",
    "currency",
    "isPaymentConfirmed",
    "payment_confirmed_at",
    "driverId",
    "vehicle_plate_number",
    "createdAt",
  ],
  rideRequestDetails = [
    "id",
    "rideOrderId",
    "pickup_location",
    "pickup_coordinates",
    "destination",
    "destination_coordinates",
    "vehicleTypeId",
    "calculated_distance",
    "final_distance",
    "calculated_duration",
    "final_duration",
    "calculated_amount",
    "final_amount",
    "currency",
    "paymentStatus",
    "modeOfPayment",
    "trip_start_at",
    "trip_status",
    "driverId",
    "customerId",
    "createdAt",
    "vehicleId",
    "trip_started_at",
    "trip_ended_at"
  ],

  notification = [  "subject","message","sender","hasRead","createdAt" ],
  currencyDetails = ["id", "currency", "newRate", "approvedRate", "createdBy", "createdAt"],
  currencyShortDetails = ["id", "currency", "approvedRate", "createdBy", "createdAt"],

  adminViewDetails = [
    "id",
    "firstName",
    "lastName",
    "email",
    "phone",
    "profile_picture",
    "drivers_license_front",
    "drivers_license_back",
    "isOnline",
    "accountStatus",
    "country",
    "role"

  ],
 customerPreviousRideAdminView = [
  "id",
  "pickup_location",
  "destination",
  "vehicleTypeId",
  "trip_start_at",
  "trip_status",
  "driverId",
  "customerId",
  "createdAt",
  "trip_started_at",
  "trip_ended_at",
  "rideOrderId"
 ],
 //delivery requests
 deliveryRequestFullDetails = [
  "id",
  "deliveryOrderId",
  "pickup_coordinates",
  "destination_coordinates",
  "pickup_location",
  "pickup_latitude",
  "pickup_longitude",
  "destination",
  "destination_latitude",
  "destination_longitude",
  "vehicleTypeId",
  "calculated_distance",
  "final_distance",
  "calculated_duration",
  "final_duration",
  "calculated_amount",
  "final_amount",
  "paymentStatus",
  "trip_start_at",
  "trip_status",
  "modeOfPayment",
  "currency",
  "isPaymentConfirmed",
  "payment_confirmed_at",
  "driverId",
  "vehicle_plate_number",
  "createdAt",
  "recipientFullName",
  "recipientPhoneNumber",
  "categoryId",
  "item",
  "estimatedCost",
  "quantity",
  "weight",
  "itemImage"
],
deliveryRequestDetails = [
  "id",
  "deliveryOrderId",
  "pickup_location",
  "pickup_coordinates",
  "destination",
  "destination_coordinates",
  "vehicleTypeId",
  "calculated_distance",
  "final_distance",
  "calculated_duration",
  "final_duration",
  "calculated_amount",
  "final_amount",
  "currency",
  "paymentStatus",
  "modeOfPayment",
  "trip_start_at",
  "trip_status",
  "driverId",
  "customerId",
  "createdAt",
  "vehicleId",
  "trip_started_at",
  "trip_ended_at"
];




module.exports = {
  customerDetails,
  driverDetails,
  carOwnerDetails,
  adminDetails,
  vehicleDetails,
  rideRequestDetails,
  rideRequestFullDetails,
  vehicleTypeDetails,
  currencyDetails,
  currencyShortDetails,
  notification,
  adminViewDetails,
  customerPreviousRideAdminView,
  deliveryRequestFullDetails,
  deliveryRequestDetails
};
