import { ICustomSerialization } from "../source/serdestrium.js";

export class SimpleTestClass
{
    public name = "";
    public age = 35;
    public isActive = false;
    public preferences = {
        mail: "john.doe@example.com",
        marketing: false
    };

    setName(name: string): void
    {
        this.name = name;
    }

    incrementAge(): void
    {
        this.age++;
    }

    toggleActive(): void
    {
        this.isActive = !this.isActive;
    }
}

export class CustomizedTestClass implements ICustomSerialization
{
    public name = "";
    public age = 35;
    #isActive = false;
    public preferences = {
        mail: "john.doe@example.com",
        marketing: false
    };

    subscribe(mail: string)
    {
        this.preferences.mail = mail;
    }

    unsubscribe()
    {
        this.preferences.mail = "";
    }

    consent()
    {
        this.preferences.marketing = true;
    }

    revokeConsent()
    {
        this.preferences.marketing = false;
    }

    onPostSerialization(dataObject: any)
    {
        dataObject.isActive = this.#isActive;
    }

    onDeserialization(dataObject: any)
    {
        this.#isActive = dataObject.isActive;
        delete dataObject.isActive;
        Object.assign(this, dataObject);
    }
}

export class TestRing<T>
{
    private entry: TestRingElement<T> | null = null;

    add(value: T): void
    {
        const newElement = new TestRingElement<T>(value);
        if (!this.entry)
        {
            newElement.next = newElement;
            newElement.previous = newElement;
            this.entry = newElement;
        }
        else
        {
            const leftElement = this.entry.previous!;
            const rightElement = this.entry;
            
            newElement.previous = leftElement;
            leftElement.next = newElement;
            newElement.next = rightElement;
            rightElement.previous = newElement;
        }
    }

    rotateLeft()
    {
        if (this.entry)
        {
            this.entry = this.entry.next!;
        }
    }

    rotateRight()
    {
        if (this.entry)
        {
            this.entry = this.entry.previous!;
        }
    }
}

export class TestRingElement<T>
{
    constructor(
        public value: T,
        public next: TestRingElement<T> | null = null,
        public previous: TestRingElement<T> | null = null,
    ) { }
}