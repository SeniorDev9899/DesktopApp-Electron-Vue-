// 加载模板
export default function loadTemplate(template) {
    let promise;
    const pathRegex = new RegExp(/^([a-z_\-\s0-9./]+)+\.html$/);
    const isTemplateUrl = pathRegex.test(template);
    if (isTemplateUrl) {
        promise = $.get(`${template}`);
    } else {
        const html = $(template).html();
        promise = $.Deferred().resolve(html).promise();
    }
    return promise;
}
