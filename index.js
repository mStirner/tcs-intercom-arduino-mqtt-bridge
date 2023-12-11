const pkg = require("./package.json");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline")
const dotenv = require("dotenv");
const mqtt = require("mqtt");
const dateformat = require("dateformat");


console.log(`Started v${pkg.version}...`);

const { error, parsed } = dotenv.config();

if (error) {
    if (error.code === "ENOENT") {

        console.log("No .env file found");

    } else {

        console.error(error);
        process.exit(1);

    }
}

const {
    SERIAL_PORT,
    SERIAL_BAUD,
    MQTT_HOST,
    MQTT_PORT,
    MQTT_TOPIC,
    SERIALS
} = process.env = Object.assign({
    SERIAL_PORT: "/dev/ttyACM0",
    SERIAL_BAUD: "9600",
    MQTT_HOST: "127.0.0.1",
    MQTT_PORT: "1883",
    MQTT_TOPIC: "doorman",
    SERIALS: ""
}, parsed, process.env);


const client = mqtt.connect({
    host: MQTT_HOST,
    port: MQTT_PORT
});

const port = new SerialPort({
    path: SERIAL_PORT,
    baudRate: Number(SERIAL_BAUD),
    autoOpen: false
});


const parser = new ReadlineParser({
    delimiter: "\r\n"
});

const pipeline = port.pipe(parser);


pipeline.on("data", (data) => {

    // log everything on the tcs bus
    console.log(dateformat(Date.now(), "yyyy.mm.dd - HH:MM.ss.l"), data);

    // notify only on our own serial number
    if (SERIALS.split(",").includes(data)) {
        console.log("Klingel betätigt!");
        client.publish(MQTT_TOPIC, `Klingel betätigt! (${data})`);
    }

});


client.on("connect", () => {

    console.log("Connected to mqtt host", MQTT_HOST);

    port.open((err) => {
        console.log(err || "Connected to serial port", SERIAL_PORT);
    });

});