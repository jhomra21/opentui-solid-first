import { createSignal, onCleanup, For, Show, onMount } from "solid-js";
import { useTimeline } from "@opentui/solid";

interface AsciiAnimationProps {
  text: string;
  onComplete?: () => void;
  letterDelay?: number;
}

type FontName = "tiny" | "block" | "shade" | "slick" | "huge" | "grid" | "pallet";

interface LetterState {
  char: string;
  visible: boolean;
  font: FontName;
}

export function AsciiAnimation(props: AsciiAnimationProps) {
  const letterDelay = () => props.letterDelay ?? 120;
  const text = () => props.text;

  const [letters, setLetters] = createSignal<LetterState[]>(
    text()
      .split("")
      .map((char) => ({ char, visible: false, font: "huge" as FontName })),
  );

  const timeline = useTimeline({ autoplay: false });

  onMount(() => {
    const chars = text().split("");
    const totalDuration = chars.length * letterDelay();
    const endTime = totalDuration + 150;

    timeline.duration = endTime;

    // Schedule each letter to appear
    chars.forEach((char, i) => {
      const appearTime = i * letterDelay();

      // Letter appears with large font
      timeline.call(() => {
        setLetters((prev) => {
          const next = [...prev];
          next[i] = { char, visible: true, font: "huge" };
          return next;
        });
      }, appearTime);

      // Letter shrinks to medium font
      timeline.call(() => {
        setLetters((prev) => {
          const next = [...prev];
          next[i] = { char, visible: true, font: "slick" };
          return next;
        });
      }, appearTime + 50);

      // Letter shrinks to final font
      timeline.call(() => {
        setLetters((prev) => {
          const next = [...prev];
          next[i] = { char, visible: true, font: "block" };
          return next;
        });
      }, appearTime + 100);
    });

    // Call onComplete after all letters are done
    const onComplete = props.onComplete;
    timeline.call(() => {
      onComplete?.();
    }, endTime);

    timeline.play();

    onCleanup(() => {
      timeline.pause();
    });
  });

  return (
    <box flexDirection="row" justifyContent="center" alignItems="center" flexGrow={1}>
      <For each={letters()}>
        {(letter) => (
          <Show when={letter.visible}>
            <ascii_font font={letter.font} text={letter.char} />
          </Show>
        )}
      </For>
    </box>
  );
}
