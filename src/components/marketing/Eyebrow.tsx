import { ReactNode } from 'react';

interface Props {
  num: string;
  children: ReactNode;
}

export default function Eyebrow({ num, children }: Props) {
  return (
    <div className="label-caps eyebrow-marketing">
      <span className="eyebrow-num">§ {num}</span>
      <span className="eyebrow-sep">—</span>
      <span>{children}</span>
    </div>
  );
}
