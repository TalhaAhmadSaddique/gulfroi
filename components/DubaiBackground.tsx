export default function DubaiBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: "url('/dubai-skyline.jpg')", backgroundAttachment: "fixed" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(7,8,9,0.25) 0%, rgba(7,8,9,0.45) 55%, rgba(7,8,9,0.6) 100%)",
        }}
      />
    </div>
  );
}
