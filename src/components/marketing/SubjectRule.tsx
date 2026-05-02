interface Props { color?: string; }

export default function SubjectRule({ color = 'var(--maths-colour)' }: Props) {
  return <div className="subject-rule" style={{ background: color }} aria-hidden="true" />;
}
