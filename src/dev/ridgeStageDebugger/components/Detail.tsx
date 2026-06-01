export function Detail({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="font-mono text-[10px] font-black uppercase tracking-widest text-[#5a554f]">
        {label}
      </dt>
      <dd className="min-w-0 break-words font-bold text-[#1a1a1a]">{value}</dd>
    </>
  );
}
