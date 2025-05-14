const express = require('express');
const soap = require('soap');
const bodyParser = require('body-parser');
const http = require('http');

const app = express();
app.use(bodyParser.raw({ type: () => true, limit: '5mb' }));

// SOAP service definition
const service = {
    IMCService: {
        IMCPort: {
            calculateIMC: function (args) {
                const weight = parseFloat(args.weight);
                const height = parseFloat(args.height);
                if (!weight || !height || height <= 0) {
                    throw new Error('Invalid input');
                }
                const imc = weight / (height * height);
                return { imc: imc.toFixed(2) };
            },
        },
    },
};

const wsdl = `
<definitions name="IMCService"
    targetNamespace="http://www.example.org/IMCService/"
    xmlns:tns="http://www.example.org/IMCService/"
    xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
    xmlns:xsd="http://www.w3.org/2001/XMLSchema"
    xmlns="http://schemas.xmlsoap.org/wsdl/">

    <message name="calculateIMCRequest">
        <part name="weight" type="xsd:float"/>
        <part name="height" type="xsd:float"/>
    </message>
    <message name="calculateIMCResponse">
        <part name="imc" type="xsd:string"/>
    </message>

    <portType name="IMCPortType">
        <operation name="calculateIMC">
            <input message="tns:calculateIMCRequest"/>
            <output message="tns:calculateIMCResponse"/>
        </operation>
    </portType>

    <binding name="IMCBinding" type="tns:IMCPortType">
        <soap:binding style="rpc" transport="http://schemas.xmlsoap.org/soap/http"/>
        <operation name="calculateIMC">
            <soap:operation soapAction="http://www.example.org/IMCService/calculateIMC"/>
            <input>
                <soap:body use="literal"/>
            </input>
            <output>
                <soap:body use="literal"/>
            </output>
        </operation>
    </binding>

    <service name="IMCService">
        <port name="IMCPort" binding="tns:IMCBinding">
            <soap:address location="http://localhost:3000/soap"/>
        </port>
    </service>
</definitions>
`;

const server = http.createServer(app);
soap.listen(server, '/soap', service, wsdl);

server.listen(3000, () => {
    console.log('SOAP server running on http://localhost:3000/soap');
});