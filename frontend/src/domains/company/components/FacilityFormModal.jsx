import { useMemo, useState } from "react";
import Button from "../../../shared/components/Button";
import AddressSearchField from "./AddressSearchField";
import { CustomInput, CustomSelect } from "./CompanyUI";
import { normalizeFacility } from "../utils/facilityData";

const createInitialForm = (facility) => {
  if (!facility) {
    return {
      facility_name: "",
      facility_type: "공장",
      address: "",
      contract_power_kw: 0,
      latitude: null,
      longitude: null,
    };
  }

  const normalized = normalizeFacility(facility);
  return {
    id: normalized.id,
    facility_name: normalized.facilityName,
    facility_type: normalized.facilityType,
    address: normalized.address === "주소 미등록" ? "" : normalized.address,
    contract_power_kw: normalized.contractPowerKw,
    latitude: normalized.latitude,
    longitude: normalized.longitude,
  };
};

export default function FacilityFormModal({ facility, onClose, onSave }) {
  const initialForm = useMemo(() => createInitialForm(facility), [facility]);
  const [formData, setFormData] = useState(initialForm);
  const isEdit = Boolean(formData.id);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: name === "contract_power_kw" ? Number(value) : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section className="form-modal" onClick={(event) => event.stopPropagation()}>
        <header className="form-modal-header">
          <div>
            <span className="section-kicker">FACILITY MASTER DATA</span>
            <h2>{isEdit ? "사업장 정보 수정" : "신규 사업장 등록"}</h2>
            <p>ESG 원천 데이터가 연결될 사업장 기준정보를 입력합니다.</p>
          </div>
          <button type="button" className="modal-close-button" onClick={onClose} aria-label="닫기">×</button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="form-modal-grid">
            <div className="field-span-two">
              <CustomInput
                label="사업장명"
                name="facility_name"
                value={formData.facility_name}
                onChange={handleChange}
                placeholder="사업장 이름을 입력하세요"
                required
              />
            </div>

            <CustomSelect
              label="사업장 유형"
              name="facility_type"
              value={formData.facility_type}
              onChange={handleChange}
              required
              options={[
                { value: "HQ", label: "본사" },
                { value: "FACTORY", label: "공장" },
                { value: "OFFICE", label: "사무실" },
                { value: "WAREHOUSE", label: "창고" },
                { value: "ETC", label: "기타" },
              ]}
            />

            <CustomInput
              label="한전 계약전력 (kW)"
              type="number"
              min="0"
              name="contract_power_kw"
              value={formData.contract_power_kw}
              onChange={handleChange}
              placeholder="0"
              required
            />

            <div className="field-span-two">
              <AddressSearchField
                address={formData.address}
                required
                onChange={({ address, latitude, longitude }) => {
                  setFormData((current) => ({
                    ...current,
                    address,
                    latitude,
                    longitude,
                  }));
                }}
              />
            </div>
          </div>

          <p className="form-required-note"><span>*</span> 표시는 필수 입력 항목입니다.</p>

          <footer className="form-modal-footer">
            <Button type="button" variant="outline" onClick={onClose}>취소</Button>
            <Button type="submit">{isEdit ? "변경사항 저장" : "사업장 등록"}</Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
