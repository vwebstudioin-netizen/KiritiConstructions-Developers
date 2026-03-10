import { FiPhone } from 'react-icons/fi'

interface PaymentButtonProps {
  paymentId?: string
  projectId?: string
  clientId?: string
  amount: number
  description?: string
  clientName?: string
  clientEmail?: string
  clientPhone?: string
}

// Payments are handled offline — clients contact the office directly
export default function PaymentButton({ amount }: PaymentButtonProps) {
  return (
    <a
      href="tel:+919386655555"
      className="flex items-center gap-1.5 font-body text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-light transition-colors mt-1"
    >
      <FiPhone size={12} />
      Contact to Pay
    </a>
  )
}
