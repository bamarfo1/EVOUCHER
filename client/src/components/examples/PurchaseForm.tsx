import PurchaseForm from '../PurchaseForm';

export default function PurchaseFormExample() {
  const handleSubmit = (data: { email: string; phone: string; examType: string }) => {
    console.log('Purchase form submitted:', data);
    alert(`Form submitted!\nEmail: ${data.email}\nPhone: ${data.phone}\nExam: ${data.examType}`);
  };

  return <PurchaseForm onSubmit={handleSubmit} />;
}
