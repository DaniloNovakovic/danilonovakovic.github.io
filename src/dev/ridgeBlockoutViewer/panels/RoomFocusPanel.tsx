import type { RidgeBlockoutViewerModel } from '../model';

export function RoomFocusPanel({
  model,
  onFocusRoom
}: {
  model: RidgeBlockoutViewerModel;
  onFocusRoom: (roomId: string) => void;
}) {
  return (
    <section className="border-b-2 border-[#1a1a1a] py-4">
      <h2 className="text-lg font-black">Focus</h2>
      <label className="mt-3 block">
        <span className="sr-only">Focus room</span>
        <select
          aria-label="Focus room"
          className="h-9 w-full border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2 text-sm font-black"
          defaultValue=""
          onChange={(event) => {
            if (event.target.value) onFocusRoom(event.target.value);
          }}
        >
          <option value="" disabled>
            Pick a room
          </option>
          {model.rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.title}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-2 text-xs font-bold text-[#5a554f]">
        Double-click a room outline to focus it directly.
      </p>
    </section>
  );
}
