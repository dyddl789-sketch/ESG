const paths = {
  dashboard: "M3 3h7v8H3V3Zm11 0h7v5h-7V3ZM3 15h7v6H3v-6Zm11-3h7v9h-7v-9Z",
  sync: "M20 7h-4V3l-2 2a7 7 0 0 0-9 10l2-1a5 5 0 0 1 7-7l2 2h4V7Zm-2 3a5 5 0 0 1-7 7l-2-2H5v2h4v4l2-2a7 7 0 0 0 9-10l-2 1Z",
  database: "M4 5c0-2 4-3 8-3s8 1 8 3-4 3-8 3-8-1-8-3Zm0 3c2 2 6 3 8 3s6-1 8-3v4c0 2-4 3-8 3s-8-1-8-3V8Zm0 7c2 2 6 3 8 3s6-1 8-3v4c0 2-4 3-8 3s-8-1-8-3v-4Z",
  document: "M6 2h8l5 5v15H6V2Zm8 1v5h5M9 12h7M9 16h7",
  chart: "M4 20V9h3v11H4Zm6 0V4h3v16h-3Zm6 0v-7h3v7h-3Z",
  report: "M5 2h11l4 4v16H5V2Zm11 1v4h4M8 11h9M8 15h9M8 19h6",
  company: "M3 21V7l9-4 9 4v14h-6v-6H9v6H3Zm4-11h2v2H7v-2Zm4 0h2v2h-2v-2Zm4 0h2v2h-2v-2Z",
  approval: "m4 12 5 5L20 6l-2-2-9 9-3-3-2 2Z",
  users: "M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 21v-2c0-4 3-6 6-6s6 2 6 6v2H2Zm13 0v-2c0-2-1-4-2-5 1-1 2-1 3-1 3 0 6 2 6 6v2h-7Z",
  indicator: "M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 4 5 3-5 3-5-3 5-3Zm-6 6 4 2v4l-4-2v-4Zm8 6v-4l4-2v4l-4 2Z",
  audit: "M5 3h14v18H5V3Zm3 4h8M8 11h8M8 15h5",
  compare: "M7 3v14l-3-3-2 2 6 6 6-6-2-2-3 3V3H7Zm10 18V7l3 3 2-2-6-6-6 6 2 2 3-3v14h2Z",
  menu: "M3 6h18M3 12h18M3 18h18",
  logout: "M10 4H5v16h5M14 8l4 4-4 4M18 12H9",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM9 20h6",
  search: "m21 21-5-5m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
  download: "M12 3v12m0 0 5-5m-5 5-5-5M4 21h16",
  upload: "M12 21V9m0 0 5 5m-5-5-5 5M4 3h16",
  ai: "M8 3h8l5 5v8l-5 5H8l-5-5V8l5-5Zm1 13 1-3h4l1 3m-4-6h2",
};

export default function Icon({ name, size = 20, className = "" }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name] ?? paths.dashboard} />
    </svg>
  );
}
