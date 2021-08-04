"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Product_module_less_1 = __importDefault(require("./Product.module.less"));
const getTarget = (url) => url.startsWith('http') &&
    !url.includes('gitee.io') &&
    !url.includes('antv.vision')
    ? '_blank'
    : '_self';
const Product = ({ name, icon, url = '', slogan, description, links = [], style, language, }) => (react_1.default.createElement("li", { className: Product_module_less_1.default.product, style: style },
    react_1.default.createElement("a", { href: url, target: getTarget(url) },
        react_1.default.createElement("img", { alt: name, src: icon })),
    react_1.default.createElement("div", { className: Product_module_less_1.default.productContent },
        react_1.default.createElement("a", { href: url, target: getTarget(url) },
            react_1.default.createElement("h4", null,
                name,
                react_1.default.createElement("span", { className: Product_module_less_1.default.productSlogan, style: { opacity: language === 'en' ? 0.7 : '' } }, slogan))),
        react_1.default.createElement("div", { className: Product_module_less_1.default.productDescription }, description),
        react_1.default.createElement("div", { className: Product_module_less_1.default.productLinks }, links.slice(0, 2).map((item) => (react_1.default.createElement("a", { href: item.url, target: getTarget(item.url || ''), key: item.url }, item.title)))))));
exports.default = Product;
