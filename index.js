const express = require('express');
const soap = require('soap');
const bodyParser = require('body-parser');
const { parseString } = require('xml2js');

const app = express();

// Middleware
app.use(bodyParser.raw({type: function(){return true;}, limit: '5mb'}));

// WSDL XML for the IMC service
const wsdl = `
<definitions name="IMCService" 
targetNamespace="urn:IMCService"
xmlns="http://schemas.xmlsoap.org/wsdl/"
xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
xmlns:tns="urn:IMCService"
xmlns:xsd="http://www.w3.org/2001/XMLSchema">

<types>
<xsd:schema targetNamespace="urn:IMCService">
    <xsd:element name="CalculateIMCRequest">
    <xsd:complexType>
        <xsd:sequence>
        <xsd:element name="weight" type="xsd:float"/>
        <xsd:element name="height" type="xsd:float"/>
        </xsd:sequence>
    </xsd:complexType>
    </xsd:element>
    <xsd:element name="CalculateIMCResponse">
    <xsd:complexType>
        <xsd:sequence>
        <xsd:element name="imc" type="xsd:float"/>
        <xsd:element name="classification" type="xsd:string"/>
        </xsd:sequence>
    </xsd:complexType>
    </xsd:element>
</xsd:schema>
</types>

<message name="CalculateIMCInput">
<part name="parameters" element="tns:CalculateIMCRequest"/>
</message>
<message name="CalculateIMCOutput">
<part name="parameters" element="tns:CalculateIMCResponse"/>
</message>

<portType name="IMCPortType">
<operation name="CalculateIMC">
    <input message="tns:CalculateIMCInput"/>
    <output message="tns:CalculateIMCOutput"/>
</operation>
</portType>

<binding name="IMCBinding" type="tns:IMCPortType">
<soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http"/>
<operation name="CalculateIMC">
    <soap:operation soapAction="urn:IMCService#CalculateIMC"/>
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
    <soap:address location="http://localhost:8000/soap/imc"/>
</port>
</service>
</definitions>
`;

// Service implementation
const service = {
IMCService: {
IMCPortType: {
    CalculateIMC: function(args) {
    const weight = args.parameters.weight;
    const height = args.parameters.height;
    
    if (isNaN(weight) || isNaN(height) || height <= 0) {
        throw new Error('Invalid input: weight and height must be positive numbers');
    }
    
    const imc = weight / (height * height);
    let classification;
    
    if (imc < 18.5) {
        classification = "Underweight";
    } else if (imc < 25) {
        classification = "Normal weight";
    } else if (imc < 30) {
        classification = "Overweight";
    } else {
        classification = "Obesity";
    }
    
    return {
        parameters: {
        imc: imc,
        classification: classification
        }
    };
    }
}
}
};

// SOAP endpoint
app.post('/soap/imc', function(req, res) {
const xml = req.body.toString('utf-8');

parseString(xml, (err, result) => {
if (err) {
    res.status(500).send('Error parsing XML');
    return;
}

soap.listen(app, '/soap/imc', service, wsdl);

// Manually handle the response
const contentType = req.headers['content-type'] || '';
if (contentType.includes('text/xml')) {
    res.set('Content-Type', 'text/xml');
}
});
});

// WSDL endpoint
app.get('/wsdl', function(req, res) {
res.type('application/xml');
res.send(wsdl);
});

// Start server
const port = 8000;
app.listen(port, function() {
console.log(`SOAP server running at http://localhost:${port}`);
console.log(`WSDL available at http://localhost:${port}/wsdl`);
console.log(`SOAP endpoint at http://localhost:${port}/soap/imc`);
});