type Props = {
  businessName?: string | undefined;
  reason?: string | undefined;
};

/** Shown instead of the site when the CMS has suspended the tenant. */
export function SuspendedPage({ businessName, reason }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div
          className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-muted text-3xl"
          aria-hidden="true"
        >
          ⏸
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {businessName ? `${businessName} is temporarily unavailable` : "This site is temporarily unavailable"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This website has been suspended. If you are the owner, please contact support to have it restored.
        </p>
        {reason ? (
          <p className="mt-4 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            {reason}
          </p>
        ) : null}
      </div>
    </div>
  );
}