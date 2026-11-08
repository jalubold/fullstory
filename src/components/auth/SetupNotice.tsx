export function SetupNotice({ issues }: { issues: string[] }) {
  if (!issues.length) return null;
  return (
    <div className="mb-6 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
      <p className="font-medium">Accounts aren’t available yet</p>
      <p className="mt-1">This site hasn’t finished connecting its backend:</p>
      <ul className="mt-1 list-disc pl-5">
        {issues.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
