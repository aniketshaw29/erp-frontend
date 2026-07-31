interface AmountDisplayProps {
  amount: number
}

export default function AmountDisplay({ amount }: AmountDisplayProps) {
  return (
    <span>
      ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
    </span>
  )
}
