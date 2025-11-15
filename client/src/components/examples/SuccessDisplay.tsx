import SuccessDisplay from '../SuccessDisplay';

export default function SuccessDisplayExample() {
  const mockVoucherData = {
    serial: "2024-WAEC-8475",
    pin: "5839-2647-1093",
    email: "student@example.com",
    phone: "+233 24 123 4567",
    examType: "May/June WASSCE"
  };

  const handleStartNew = () => {
    console.log('Start new purchase clicked');
    alert('Starting new purchase...');
  };

  return <SuccessDisplay voucherData={mockVoucherData} onStartNew={handleStartNew} />;
}
