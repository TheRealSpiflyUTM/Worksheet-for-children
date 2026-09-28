package com.worksheet.minigame;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.JsonNodeFactory;
import tools.jackson.databind.node.ObjectNode;

@Component
public class MiniGameDataInitializer implements CommandLineRunner {

private final MiniGameDefinitionRepository repository;

public MiniGameDataInitializer(MiniGameDefinitionRepository repository) {
    this.repository = repository;
}

@Override
public void run(String... args) {
    createIfMissing(
        "Color Game",
        "color-game",
        colorConfigurationSchema(),
        colorDefaultConfiguration()
    );

    createIfMissing(
        "Easy Math",
        "math-game",
        mathConfigurationSchema(),
        mathDefaultConfiguration()
    );

    createIfMissing(
        "Number Sequence",
        "sequence-game",
        sequenceConfigurationSchema(),
        sequenceDefaultConfiguration()
    );

    createIfMissing(
        "Higher or Lower",
        "higher-lower-game",
        higherLowerConfigurationSchema(),
        higherLowerDefaultConfiguration()
    );

    createIfMissing(
        "Odd or Even",
        "odd-even-game",
        oddEvenConfigurationSchema(),
        oddEvenDefaultConfiguration()
    );
}

private void createIfMissing(
    String name,
    String type,
    JsonNode configurationSchema,
    JsonNode defaultConfiguration
) {
    if (repository.existsByTypeIgnoreCaseAndVersion(type, 1)) {
        return;
    }

    repository.save(
        new MiniGameDefinition(
            name,
            type,
            1,
            configurationSchema,
            emptyObject(),
            defaultConfiguration,
            null,
            true
        )
    );
}

private JsonNode colorConfigurationSchema() {
    ObjectNode schema = baseObjectSchema();

    ObjectNode animals = JsonNodeFactory.instance.objectNode();
    animals.put("type", "array");

    schema.set("animals", animals);

    ObjectNode letter = JsonNodeFactory.instance.objectNode();
    letter.put("type", "string");

    schema.set("letter", letter);

    return schema;
}

private JsonNode colorDefaultConfiguration() {
    ObjectNode config = JsonNodeFactory.instance.objectNode();

    config.put("letter", "u");

    config.set(
        "animals",
        JsonNodeFactory.instance.arrayNode()
    );

    return config;
}

private JsonNode mathConfigurationSchema() {
    ObjectNode schema = baseObjectSchema();

    ObjectNode maxNumber = JsonNodeFactory.instance.objectNode();
    maxNumber.put("type", "integer");
    maxNumber.put("minimum", 1);

    schema.set("maxNumber", maxNumber);

    ObjectNode operations = JsonNodeFactory.instance.objectNode();
    operations.put("type", "array");

    schema.set("operations", operations);

    return schema;
}

private JsonNode mathDefaultConfiguration() {
    ObjectNode config = JsonNodeFactory.instance.objectNode();

    config.put("maxNumber", 10);

    var operations = JsonNodeFactory.instance.arrayNode();
    operations.add("+");
    operations.add("-");
    operations.add("*");
    operations.add("/");

    config.set("operations", operations);

    return config;
}

private JsonNode sequenceConfigurationSchema() {
    ObjectNode schema = baseObjectSchema();

    ObjectNode maxNumber = JsonNodeFactory.instance.objectNode();
    maxNumber.put("type", "integer");
    maxNumber.put("minimum", 1);

    schema.set("maxNumber", maxNumber);

    return schema;
}

private JsonNode sequenceDefaultConfiguration() {
    ObjectNode config = JsonNodeFactory.instance.objectNode();

    config.put("maxNumber", 10);

    return config;
}

private JsonNode higherLowerConfigurationSchema() {
    ObjectNode schema = baseObjectSchema();

    ObjectNode maxNumber = JsonNodeFactory.instance.objectNode();
    maxNumber.put("type", "integer");
    maxNumber.put("minimum", 1);

    schema.set("maxNumber", maxNumber);

    return schema;
}

private JsonNode higherLowerDefaultConfiguration() {
    ObjectNode config = JsonNodeFactory.instance.objectNode();

    config.put("maxNumber", 10);

    return config;
}

private JsonNode oddEvenConfigurationSchema() {
    ObjectNode schema = baseObjectSchema();

    ObjectNode maxNumber = JsonNodeFactory.instance.objectNode();
    maxNumber.put("type", "integer");
    maxNumber.put("minimum", 1);

    schema.set("maxNumber", maxNumber);

    return schema;
}

private JsonNode oddEvenDefaultConfiguration() {
    ObjectNode config = JsonNodeFactory.instance.objectNode();

    config.put("maxNumber", 10);

    return config;
}

private ObjectNode baseObjectSchema() {
    ObjectNode schema = JsonNodeFactory.instance.objectNode();

    schema.put("type", "object");
    schema.set(
        "properties",
        JsonNodeFactory.instance.objectNode()
    );

    return schema;
}

private ObjectNode emptyObject() {
    return JsonNodeFactory.instance.objectNode();
}

}
