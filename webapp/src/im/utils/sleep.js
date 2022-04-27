export default async millisecond => new Promise((resolve) => {
    setTimeout(resolve, millisecond);
});
