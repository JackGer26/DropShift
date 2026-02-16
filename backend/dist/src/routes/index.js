"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const staff_routes_1 = __importDefault(require("./staff.routes"));
const template_routes_1 = __importDefault(require("./template.routes"));
const rota_routes_1 = __importDefault(require("./rota.routes"));
const router = (0, express_1.Router)();
router.get('/test', (req, res) => {
    res.json({ message: 'API test successful' });
});
router.use('/staff', staff_routes_1.default);
router.use('/templates', template_routes_1.default);
router.use("/rotas", rota_routes_1.default);
exports.default = router;
