import { describe, expect, it } from "vitest";
import {
  totalVehicleArea,
  totalVehicleInstallMinutes,
  validateVehicleModel,
  vehicleDisplayName,
} from "./vehicle";

describe("vehicle domain", () => {
  it("validates model and parts", () => {
    const result = validateVehicleModel(
      { vehicle_type_id: "type", brand: "Fiat", model: "Toro", year_from: 2020 },
      [{ name: "Capô", area_m2: 1.8, difficulty_multiplier: 1.1, waste_percent: 10 }],
    );
    expect(result.valid).toBe(true);
  });

  it("rejects invalid years and parts", () => {
    const result = validateVehicleModel(
      { vehicle_type_id: "type", brand: "Fiat", model: "Toro", year_from: 2030, year_to: 2020 },
      [{ name: "", area_m2: 0, difficulty_multiplier: 0, waste_percent: -1 }],
    );
    expect(result.valid).toBe(false);
    expect(result.errors.year_to).toBeTruthy();
    expect(result.errors.parts).toBeTruthy();
  });

  it("calculates model totals", () => {
    const parts = [
      { area_m2: 1.2, install_minutes: 30, active: true },
      { area_m2: 2.3, install_minutes: 45, active: true },
      { area_m2: 9, install_minutes: 99, active: false },
    ];
    expect(totalVehicleArea(parts)).toBe(3.5);
    expect(totalVehicleInstallMinutes(parts)).toBe(75);
  });

  it("formats vehicle name", () => {
    expect(vehicleDisplayName({ brand: "VW", model: "Saveiro", year_from: 2020, year_to: 2024 })).toBe("VW Saveiro 2020–2024");
  });
});
