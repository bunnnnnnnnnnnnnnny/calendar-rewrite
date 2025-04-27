import { TextareaHTMLAttributes, KeyboardEvent } from 'react';

export function TextAreaAutoGrow(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  function handleInput(e: KeyboardEvent<HTMLTextAreaElement>) {
    const target = e.target as HTMLTextAreaElement;
    (target.parentNode as HTMLElement).setAttribute('data-replicated-value', target.value);
  }

  return (
    <div className="grow-wrap">
      <textarea onInput={handleInput} rows={1} {...props} />
    </div>
  );
}
