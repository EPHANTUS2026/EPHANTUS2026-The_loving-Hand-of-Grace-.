/** One non-interactive overlay; the protected region follows the text column. */
export default function ImageTextOverlay({direction='left'}) {
  const alignment = ['left','right','center'].includes(direction) ? direction : 'left';
  return <div aria-hidden="true" className="image-text-overlay absolute inset-0 -z-10 pointer-events-none" data-direction={alignment}/>;
}
