"use client";

export default function DeleteAccountForm() {
  return (
    <form
      action="/api/account/delete"
      method="post"
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "This disconnects Strava and permanently deletes your data from cigint. Continue?",
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <button
        type="submit"
        className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
      >
        Disconnect Strava and delete my data
      </button>
    </form>
  );
}
